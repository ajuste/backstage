import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { CatalogComponent } from './CatalogComponent';
import { wrapInTestApp } from '@backstage/test-utils';

describe('CatalogComponent', () => {
  it('should render available components', async () => {

    render(
      wrapInTestApp(
        <CatalogComponent />
      ),
    );
    await waitFor(() => screen.queryByTestId('code-coverage'));

    expect(screen.getByTestId('code-coverage')).toBeInTheDocument();
    expect(screen.getByTestId('code-coverage')).toHaveTextContent('Code coverage');
    expect(screen.getByTestId('code-coverage')).toHaveTextContent('Generate code coverage report.');
    expect(screen.getByTestId('code-coverage-link')).toHaveAttribute('href', '/reporting/code-coverage');

    expect(screen.getByTestId('service-staleness')).toBeInTheDocument();
    expect(screen.getByTestId('service-staleness')).toHaveTextContent('Service Staleness');
    expect(screen.getByTestId('service-staleness')).toHaveTextContent('Understand which services have not been updated in a while.');
    expect(screen.getByTestId('service-staleness-link')).toHaveAttribute('href', '/reporting/service-staleness');

  });
});
