import React from 'react';
import UpdateItem from '../components/UpdateItem';

const Sell = ({ query }) => {
  return (
    <div>
      <UpdateItem id={query.id} />
    </div>
  );
};

export default Sell;