import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { from } from 'rxjs';
import { useApi } from '../hooks';
import { Asset, DarwiniaAsset, IAccountMeta, Token } from '../model';
import { convertToSS58, getDarwiniaBalances, isSameAddress, readStorage, updateStorage } from '../utils';

export interface AccountCtx {
  account: string;
  setAccount: (account: string) => void;
  accountWithMeta: IAccountMeta;
  assets: Asset[];
  getBalances: (acc?: string) => void;
}

const getToken: (tokens: Token[], target: DarwiniaAsset) => Token = (tokens: Token[], target: DarwiniaAsset) => {
  return tokens.find((token) => token.symbol.toLowerCase().includes(target.toLowerCase()))!;
};

export const AccountContext = createContext<AccountCtx | null>(null);

export const AccountProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [account, setAccount] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const { network, connection, chain, api } = useApi();
  const accountWithMeta = useMemo(
    () => connection.accounts.find((item) => isSameAddress(item.address, account)) ?? connection.accounts[0],
    [account, connection]
  );

  const getBalances = useCallback(
    async (acc?: string) => {
      if (!api || !chain.tokens.length) {
        return [];
      }

      const [ring, kton] = await getDarwiniaBalances(api, acc ?? account);
      const info = await api.query.system.account(account);
      const {
        data: { free, freeKton },
      } = info.toJSON() as {
        data: { free: number; freeKton: number; reserved: number; reservedKton: number };
      };
      const res = [
        {
          max: ring,
          asset: DarwiniaAsset.ring,
          total: free,
          token: getToken(chain.tokens, network.name === 'crab' ? DarwiniaAsset.crab : DarwiniaAsset.ring),
        },
        {
          max: kton,
          asset: DarwiniaAsset.kton,
          total: freeKton,
          token: getToken(chain.tokens, DarwiniaAsset.kton),
        },
      ];

      setAssets(res);
    },
    [account, api, chain.tokens, network.name]
  );

  useEffect(() => {
    if (!api || !api.isConnected) {
      return;
    }

    const sub$$ = from(getBalances(account)).subscribe();

    return () => {
      sub$$.unsubscribe();
    };
  }, [account, api, getBalances]);

  useEffect(() => {
    const acc = account || readStorage().activeAccount || connection?.accounts[0]?.address;

    if (!acc) {
      return;
    }

    const ss58Account = convertToSS58(acc, network.ss58Prefix);

    setAccount(ss58Account);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.ss58Prefix, connection]);

  useEffect(() => {
    updateStorage({ activeAccount: account });
  }, [account]);

  return (
    <AccountContext.Provider
      value={{
        account,
        accountWithMeta,
        assets,
        setAccount,
        getBalances,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};