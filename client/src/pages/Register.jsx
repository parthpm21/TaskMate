import { SignUp } from '@clerk/clerk-react';

export default function Register() {
  return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-6">
      <div className="w-full flex justify-center">
        <SignUp
          routing="path"
          path="/register"
          forceRedirectUrl="/browse"
          fallbackRedirectUrl="/browse"
          signInUrl="/login"
          appearance={{
            variables: {
              colorPrimary: '#f5a623',
              colorBackground: '#111111',
              colorInputBackground: '#161616',
              colorInputText: '#ffffff',
              colorText: '#f0ece4',
              colorTextSecondary: '#888888',
              colorDanger: '#ef4444',
              borderRadius: '0.75rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            },
            elements: {
              card: 'shadow-2xl border border-[#222] bg-[#161616]',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-[#888]',
              formButtonPrimary: 'bg-accent text-black font-bold hover:opacity-90',
              footerActionLink: 'text-accent hover:underline',
              identityPreviewEditButton: 'text-accent',
              formFieldInput: 'bg-[#111] border border-[#2a2a2a] text-white placeholder-[#444]',
            },
          }}
        />
      </div>
    </div>
  );
}
