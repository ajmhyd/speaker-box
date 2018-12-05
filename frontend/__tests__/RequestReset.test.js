import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import RequestReset, { REQUEST_RESET_MUTATION } from '../components/RequestReset';
import { MockedProvider } from 'react-apollo/test-utils';

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: 'amatseshe@gmail.com' },
    },
    result: {
      data: { requestReset: { message: 'success', __typename: 'Message' } },
    },
  },
];

describe('<RequestRest/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount (
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it('calls the mutation', async () => {
    const wrapper = mount (
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );
    // simulate typing an email
    wrapper
      .find('input')
      .simulate('change', { target: { name: 'email', value: 'amatseshe@gmail.com' } });
      // submit form
      wrapper.find('form').simulate('submit');
      await wait();
      wrapper.update();
      expect(wrapper.find('p').text()).toContain('Success! Check your email for a reset link!');
  });
});
