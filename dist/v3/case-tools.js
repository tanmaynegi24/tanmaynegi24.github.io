export function estimateMarket({ population, targetSharePercent, annualSpend }) {
  const total = Number(population);
  const share = Number(targetSharePercent);
  const spend = Number(annualSpend);
  if (![total, share, spend].every(Number.isFinite) || total < 0 || share < 0 || share > 100 || spend < 0) {
    throw new RangeError('Use non-negative values and a target share from 0 to 100%.');
  }
  const customers = total * share / 100;
  return { customers, annualValue: customers * spend };
}

export function calculateBreakEven({ price, variableCost, fixedCosts }) {
  const revenue = Number(price);
  const cost = Number(variableCost);
  const fixed = Number(fixedCosts);
  if (![revenue, cost, fixed].every(Number.isFinite) || revenue < 0 || cost < 0 || fixed < 0) {
    throw new RangeError('Use non-negative values for revenue and costs.');
  }
  const contribution = revenue - cost;
  return {
    contribution,
    contributionMargin: revenue > 0 ? contribution / revenue : null,
    breakEvenUnits: contribution > 0 ? Math.ceil(fixed / contribution) : null
  };
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(value);
}
