import React from 'react';
import { IdentityProviders, SignInPage } from '@backstage/core-components';
import { createSignInPageExtension, } from '@backstage/frontend-plugin-api';
import { githubAuthApiRef } from '@backstage/core-plugin-api';

const providers = [{
    id: 'github-auth-provider',
    title: 'GitHub',
    message: 'Sign in using GitHub',
    apiRef: githubAuthApiRef,
}] as IdentityProviders;

const env = process.env.NODE_ENV;

if (!env || env === 'development') {
    providers.push('guest');
}

export const SigninPage = createSignInPageExtension({
    name: 'github',
    loader: async () => props =>
    (
        <SignInPage
            {...props}
            providers={providers}
        />
    ),
});