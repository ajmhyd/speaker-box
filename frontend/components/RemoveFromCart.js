import React from 'react';
import { Mutation } from 'react-apollo';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const REMOVE_FROM_CART_MUTATION = gql`
  mutation removeFromCart($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

class RemoveFromCart extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  };

  // this gets called as soon as we get a response back from the server after a mutation has been performed
  update = (cache, payload) => {
    // 1. read cache
    const data = cache.readQuery({ query: CURRENT_USER_QUERY });
    // 2. remove item from cart
    const cartItemId = payload.data.removeFromCart.id;
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);
    // 3. write it back to cache
    cache.writeQuery({ query: CURRENT_USER_QUERY, data });
  };

  render() {
    return (
    <Mutation
      mutation={REMOVE_FROM_CART_MUTATION}
      variables={{id: this.props.id}}
      update={this.update}
      optimisticResponse={{
        __typename:'Mutation',
        removeFromCart: {
          __typename: 'CartItem',
          id: this.props.id,
        },
      }}
    >
      {(removeFromCart, { loading, error }) => (
        <BigButton
          title="Delete Item"
          onClick={() => {removeFromCart().catch(err => alert(err.message));}}
          disabled={loading}
        >
          &times;
        </BigButton>
      )}
    </Mutation>
    );
  };
}

export default RemoveFromCart;