import { useUsageCost } from '~/services/openai';
import styles from './UsageCost.module.css';

export default function UsageCost() {
  const usageCost = useUsageCost();
  return <span className={styles.cost}>$ {usageCost.toFixed(2)}</span>;
}
