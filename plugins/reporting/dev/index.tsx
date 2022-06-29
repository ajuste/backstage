import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { reportingPlugin, ReportingPage } from '../src/plugin';

createDevApp()
  .registerPlugin(reportingPlugin)
  .addPage({
    element: <ReportingPage />,
    title: 'Root Page',
    path: '/reporting'
  })
  .render();
