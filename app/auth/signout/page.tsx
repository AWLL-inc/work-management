import SignOutButton from "./components/SignOutButton";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md border">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              サインアウト
            </h2>
            <p className="text-gray-600 mb-6">本当にサインアウトしますか？</p>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
