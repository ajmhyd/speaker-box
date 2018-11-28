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

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

onToken = (res) => {
  console.log(res.id);
}
class TakeMyMoney extends React.Component {
  render() {
    return (
      <User>
      {({ data: { me } }) => (
      <StripeCheckout
      amount={calcTotalPrice(me.cart)}
      name="Sick Fits"
      description={`Order of ${totalItems(me.cart)} items!`}
      image={me.cart[0].item && me.cart[0].item.image}
      stripeKey="pk_test_24isWthp2xCIv4z6qqQhc2rZ"
      currency="USD"
      email={me.email}
      token={res => this.onToken(res)}
      >{this.props.children}</StripeCheckout>)}
      </User>
    )
  }
}

export default TakeMyMoney;