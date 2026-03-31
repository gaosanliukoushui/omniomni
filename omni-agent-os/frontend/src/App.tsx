import { useAppStore } from '@/stores';
import { Layout, Console, Ingestion, StateTracker, Config } from '@/components';

export default function App() {
  const { currentPage } = useAppStore();

  return (
    <Layout>
      {currentPage === 'console' && <Console />}
      {currentPage === 'ingestion' && <Ingestion />}
      {currentPage === 'tracker' && <StateTracker />}
      {currentPage === 'config' && <Config />}
    </Layout>
  );
}
