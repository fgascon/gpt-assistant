import { useEffect, useState } from 'react';
import { onUsageChange } from '../services/openai';
import styles from './UsageCost.module.css';

function useUsageCost() {
  const [cost, setCost] = useState(0);
  useEffect(() => onUsageChange(setCost), []);
  return cost;
}

export default function UsageCost() {
  const usageCost = useUsageCost();
  return <span className={styles.cost}>$ {usageCost.toFixed(2)}</span>;
}
