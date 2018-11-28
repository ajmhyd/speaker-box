import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      totalItems
      items {
        id
        title
      }
    }
  }
`;

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
};

onToken = async (res, createOrder) => {
  // manually call mutation once we have the stripe token
  const order = await createOrder({
    variables: {
      token: res.id,
    },
  }).catch(err => {
    alert(err.message);
  });
};

class TakeMyMoney extends React.Component {
  render() {
    return (
      <User>
      {({ data: { me } }) => (
        <Mutation mutation={CREATE_ORDER_MUTATION} refetchQueries={[{ query: CREATE_ORDER_MUTATION }]}>
          {(createOrder) => (
            <StripeCheckout
            amount={calcTotalPrice(me.cart)}
            name="Sick Fits"
            description={`Order of ${totalItems(me.cart)} items!`}
            image={me.cart.length && me.cart[0].item && me.cart[0].item.image}
            stripeKey="pk_test_24isWthp2xCIv4z6qqQhc2rZ"
            currency="USD"
            email={me.email}
            token={res => this.onToken(res, createOrder)}
            >{this.props.children}</StripeCheckout>
          )}
        </Mutation>
      )}
      </User>
    )
  }
}

export default TakeMyMoney;