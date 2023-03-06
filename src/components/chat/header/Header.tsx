import { signOut } from 'next-auth/react';

export default function Header() {
  return (
    <div className="flex justify-between border-b-2 border-gray-200 py-3 sm:items-center">
      <div className="relative flex items-center space-x-4">
        <div className="flex flex-col leading-tight">
          <div className="mt-1 flex items-center text-2xl">
            <h1 className="mr-3 text-gray-700">GPT Assistant</h1>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          className="rounded bg-gray-300 py-2 px-4 font-bold text-gray-800 hover:bg-gray-400"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
