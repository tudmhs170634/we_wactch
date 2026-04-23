import AuthForm from '@/src/components/AuthForm';
import AvatarServer from '@/src/components/AvatarServer';

import { Suspense } from 'react';

const RegisterPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm initialMode="register" avatarNode={<AvatarServer />} />
    </Suspense>
  );
};

export default RegisterPage;
