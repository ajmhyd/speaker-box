import OrderList from '../components/OrderList';
import PleaseSignIn from '../components/PleaseSignIn';

const OrderListPage = (props) => {
  return (
    <PleaseSignIn>
    <OrderList />
    </PleaseSignIn>
  );
};

export default OrderListPage;