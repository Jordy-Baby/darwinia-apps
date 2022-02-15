import Identicon from '@polkadot/react-identicon';
import { IAccountMeta } from '../../../model';
import { EllipsisMiddle } from '../EllipsisMiddle';

interface IdentAccountProps {
  account: IAccountMeta;
  className?: string;
  iconSize?: number;
}

// eslint-disable-next-line no-magic-numbers
export function IdentAccountAddress({ account: { address, meta }, className, iconSize = 32 }: IdentAccountProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Identicon size={iconSize} value={address} className="rounded-full border border-gray-100" />
      {!!meta?.name && <span className="ml-2">{meta?.name}</span>}
      <span className="mx-1">-</span>
      <EllipsisMiddle className="lg:w-full w-36 dark:text-gray-700">{address}</EllipsisMiddle>
    </div>
  );
}
