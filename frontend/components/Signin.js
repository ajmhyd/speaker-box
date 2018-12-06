import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const SIGN_IN_MUTATION = gql`
  mutation SIGN_IN_MUTATION(
    $email: String!
    $password: String!
  ) {
    signin(
      email: $email
      password: $password
    ) {
      id
      email
      name
    }
  }
`;

class Signin extends Component {
  state = {
    password: '',
    email: '',
  };
  // set form fields state
  saveToState = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    return (
      <Mutation
        mutation={SIGN_IN_MUTATION}
        variables={this.state}
        refetchQueries={[{ query: CURRENT_USER_QUERY}]}
        >
        {(signin, {loading, error}) => (
          <Form method="post" onSubmit={async (e) => {
            // stop form from submitting
            e.preventDefault();
            // call mutation
            const res = await signin();
            // clear form fields
            this.setState({ email: '', password: ''});
          }}>
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Sign In!</h2>
              <Error error={error} />
              <label htmlFor="email">
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="email"
                  value={this.state.email}
                  onChange={this.saveToState}
                />
              </label>
              <label htmlFor="password">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="password"
                  value={this.state.password}
                  onChange={this.saveToState}
                />
              </label>

              <button type="submit">Sign In!</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default  Signin;