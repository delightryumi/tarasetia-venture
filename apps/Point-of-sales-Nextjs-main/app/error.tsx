'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';

const ErrorPage = ({ error }: { error: Error }) => {
  useEffect(() => {
    toast.error(`An error occurred: ${error.message}`);
  }, [error]);

  return <div>An error occurred: {error.message}</div>;
};

export default ErrorPage;
