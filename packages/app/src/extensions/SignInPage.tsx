import React from 'react';
import { SignInPage } from '@backstage/core-components';
import { createSignInPageExtension, } from '@backstage/frontend-plugin-api';
import { githubAuthApiRef } from '@backstage/core-plugin-api';


export const SigninPage = createSignInPageExtension({
    name: 'github',
    loader: async () => props =>
    (
        <SignInPage
            {...props}
            provider={{
                id: 'github-auth-provider',
                title: 'GitHub',
                message: 'Sign in using GitHub',
                apiRef: githubAuthApiRef,
            }}
        />
    ),
});