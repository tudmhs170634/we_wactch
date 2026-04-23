import AuthForm from '@/src/components/AuthForm';
import AvatarServer from '@/src/components/AvatarServer';

import { Suspense } from 'react';

const LoginPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm initialMode="login" avatarNode={<AvatarServer />} />
    </Suspense>
  );
};

export default LoginPage;
