import React, { ChangeEvent, FormEvent } from 'react';
import BigNumber from 'bignumber.js';
import classNames from 'classnames';

import { useThemeContext } from 'libs/theme-provider';
import AmountField from 'components/fields/AmountField';
import DefaultButton from 'components/DefaultButton';

import staticStyles from './style';
import { LiquidatorsQuery } from '../../apollo/generated';

interface LiquidationFormProps {
  amount: string;
  setAmount: (value: string) => void;
  collateralReserve: string;
  setCollateralReserve: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  onSubmit: (
    amount: string,
    liquidatedUser: string,
    collateralReserve: string,
    reserveId: string,
    symbol: string
  ) => void;
  userReserve: LiquidatorsQuery['liquidation'][0];
}

export default function LiquidationForm({
  amount,
  setAmount,
  collateralReserve,
  setCollateralReserve,
  error,
  setError,
  onSubmit,
  userReserve,
}: LiquidationFormProps) {
  const { currentTheme } = useThemeContext();

  const handleCollateralClick = (event: ChangeEvent<HTMLInputElement>) => {
    setCollateralReserve(event.target.value);
  };

  const maxAmount = new BigNumber(userReserve.principalBorrows).div(2).toString();

  const handleAmountChange = (newAmount: string) => {
    const newAmountValue = new BigNumber(newAmount);
    setError('');
    if (newAmountValue.gt(maxAmount)) {
      return setAmount(maxAmount);
    }
    if (newAmountValue.isNegative()) {
      return setAmount('0');
    }
    return setAmount(newAmount);
  };

  const handleMaxButtonClick = () => {
    setAmount(maxAmount);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // @ts-ignore
    if (!new BigNumber(amount).isNaN() && amount !== '0') {
      return onSubmit(
        amount,
        userReserve.user.id,
        collateralReserve,
        userReserve.reserve.id,
        userReserve.reserve.symbol
      );
    }

    setError('Please input the correct amount');
  };

  return (
    <form className="LiquidationForm" onSubmit={handleSubmit}>
      <div className="LiquidationForm__top-inner">
        <div className="LiquidationForm__line">
          <h3>Collaterals</h3>
          {userReserve.user.reservesData
            .filter(
              item =>
                new BigNumber(item.principalATokenBalance).gt(0) &&
                item.usageAsCollateralEnabledOnUser &&
                item.reserve.usageAsCollateralEnabled
            )
            .map((res, i) => {
              return (
                <div
                  className={classNames('LiquidationForm__radioField', {
                    LiquidationForm__radioFieldActive: collateralReserve === res.reserve.id,
                  })}
                  key={i}
                >
                  <input
                    type="radio"
                    id={`Collateral__${userReserve.user.id}-${userReserve.reserve.symbol}-${i}`}
                    name="Collaterals"
                    value={res.reserve.id}
                    checked={collateralReserve === res.reserve.id}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleCollateralClick(event)
                    }
                  />
                  <label
                    htmlFor={`Collateral__${userReserve.user.id}-${userReserve.reserve.symbol}-${i}`}
                  >
                    <p>
                      <span>{res.reserve.symbol}</span>
                      {new BigNumber(res.principalATokenBalance).toFixed(res.reserve.decimals)}
                    </p>
                  </label>
                </div>
              );
            })}
        </div>

        <div className="LiquidationForm__line">
          <h3>Borrows</h3>
          <p>
            <span>{userReserve.reserve.symbol}</span>
            {new BigNumber(userReserve.principalBorrows).toFixed(userReserve.reserve.decimals)}
          </p>
        </div>
      </div>

      <div className="LiquidationForm__bottom-inner">
        <AmountField
          currency={userReserve.reserve.symbol}
          value={amount}
          onChange={handleAmountChange}
          error={error}
          withMaxButton={true}
          maxButtonClick={handleMaxButtonClick}
        />

        <DefaultButton
          title="LIQUIDATE"
          type="submit"
          disabled={error !== '' || amount === '' || collateralReserve === ''}
        />
      </div>

      <style jsx={true} global={true}>
        {staticStyles}
      </style>
      <style jsx={true}>{`
        .LiquidationForm {
          &__bottom-inner {
            border-top: 1px solid ${currentTheme.lightGrayBorder.hex};
          }

          &__line {
            h3 {
              color: ${currentTheme.gray.hex};
            }
            p {
              color: ${currentTheme.gray.hex};
              span {
                color: ${currentTheme.secondary.hex};
              }
            }
          }

          &__radioFieldActive {
            background: ${currentTheme.backgroundGray.hex};
            p {
              span {
                color: ${currentTheme.primary.hex};
              }
            }
          }
        }
      `}</style>
    </form>
  );
}
