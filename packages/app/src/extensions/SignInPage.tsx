import React from 'react';
import { IdentityProviders, SignInPage } from '@backstage/core-components';
import { createSignInPageExtension, } from '@backstage/frontend-plugin-api';
import { oktaAuthApiRef } from '@backstage/core-plugin-api';

const providers = [{
    id: 'okta-auth-provider',
    title: 'Okta',
    message: 'Sign in using Okta',
    apiRef: oktaAuthApiRef,
}] as IdentityProviders;

const env = process.env.NODE_ENV;

if (!env || env === 'development') {
    providers.push('guest');
}

export const SigninPage = createSignInPageExtension({
    name: 'okta',
    loader: async () => props =>
    (
        <SignInPage
            {...props}
            providers={providers}
        />
    ),
});