import PleaseSignIn from '../components/PleaseSignIn';
import Permissions from '../components/Permissions';

const PermissionsPage = (props) => {
  return (
    <div>
      <PleaseSignIn>
        <Permissions />
      </PleaseSignIn>
    </div>
  );
};

export default PermissionsPage;