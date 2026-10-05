import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunityIntake } from '../components/OpportunityIntake';

const OFFER = 'Congratulations! Pay Rs 2,999 registration fee within 24 hours to confirm your internship.';

const setup = () => {
  const onInvestigate = vi.fn();
  render(<OpportunityIntake onInvestigate={onInvestigate} isLoading={false} demos={[]} />);
  return { onInvestigate };
};

describe('OpportunityIntake', () => {
  it('submits the offer text together with the LinkedIn page', () => {
    const { onInvestigate } = setup();
    fireEvent.change(screen.getByLabelText('Opportunity text'), { target: { value: OFFER } });
    fireEvent.change(screen.getByLabelText(/Company LinkedIn page/), {
      target: { value: 'https://www.linkedin.com/company/acme/' }
    });
    fireEvent.submit(screen.getByLabelText('Opportunity text').closest('form')!);
    expect(onInvestigate).toHaveBeenCalledWith({ text: OFFER, linkedinUrl: 'https://www.linkedin.com/company/acme/' });
  });

  it('rejects a link that is not a LinkedIn URL', () => {
    const { onInvestigate } = setup();
    fireEvent.change(screen.getByLabelText('Opportunity text'), { target: { value: OFFER } });
    fireEvent.change(screen.getByLabelText(/Company LinkedIn page/), { target: { value: 'https://linkedin.fake.com/company/x' } });
    fireEvent.submit(screen.getByLabelText('Opportunity text').closest('form')!);
    expect(onInvestigate).not.toHaveBeenCalled();
    expect(screen.getByText(/should look like https:\/\/www.linkedin.com\/company/)).toBeInTheDocument();
  });

  it('asks for more text when the submission is too short', () => {
    const { onInvestigate } = setup();
    fireEvent.change(screen.getByLabelText('Opportunity text'), { target: { value: 'hi' } });
    fireEvent.submit(screen.getByLabelText('Opportunity text').closest('form')!);
    expect(onInvestigate).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 15 characters/)).toBeInTheDocument();
  });
});
