import SingleItem from '../components/SingleItem';

const Item = (props) => {
  return (
    <div>
      <SingleItem id={props.query.id} />
    </div>
  );
};

export default Item;