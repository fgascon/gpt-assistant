import { type NextPage } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import Chat from '~/components/chat/Chat';

const Home: NextPage = () => {
  const { status } = useSession({ required: true });

  return (
    <>
      <Head>
        <title>GPT Assistant</title>
        <meta name="description" content="Assistant Bot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{status === 'loading' ? <div>Loading...</div> : <Chat />}</main>
    </>
  );
};

export default Home;
