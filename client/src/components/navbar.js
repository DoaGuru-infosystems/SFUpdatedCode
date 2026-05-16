import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// import all image
import BLogoImg from '../assets/images/brand_logo.png'
// import LogoutImg from '../assets/images/logout.png'
import { GrLogin } from "react-icons/gr";
import { BiLogOut } from "react-icons/bi";
import { FaRegUserCircle } from "react-icons/fa";


function Navbar({Logout}) {
  const [user,setUser] = useState(localStorage.getItem('user'));
  const [userName, setUserName] = useState('default nmame');

 useEffect(()=>{
  setUser(localStorage.getItem('user'))
  let obj = localStorage.getItem('user');
  obj = JSON.parse(obj);
  console.log(obj);
  setUserName(obj?.name || 'defualt name');

 },[localStorage.getItem('user')])

  return (
    <div className="m-2 p-1 border rounded text-lg">
    <nav className="bg-gray-100">
      <div className="container mx-auto flex items-center justify-between p-2">
        <Link to="/sales/HomePage" className="p-2">
          <img src={BLogoImg} alt="Logo" className="w-28" />
        </Link>
        <button className="block lg:hidden p-2" type="button">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="lg:flex items-center">
          <ul className="flex space-x-4">
            <li>
              { !localStorage.getItem('user')  || <Link className="nav-link hidden lg:block" aria-current="page" to="/sales/HomePage">Home</Link>}
            </li>
          </ul>
          {user ? (
            <div className="flex items-center">
              <span className="text-center flex items-center mx-3 "><FaRegUserCircle className="mx-1" /> {userName}</span>
              <button onClick={Logout} className="btn btn-outline-none text-red-500 my-2 px-3 flex items-center">
                <BiLogOut /> Logout
              </button>
            </div>
          ) : (
            <button className="btn login my-2 px-3 flex items-center" type="button">
              Login <GrLogin className="ml-1" />
            </button>
          )}
        </div>
      </div>
    </nav>
  </div>
  );
};

export default Navbar;

//CSS Styled Section use only low css styled

const Wrapper = styled.section`
.navbar-brand img{
  width: 7rem;
}
/* .logout a{
  text-decoration: none;
  color: red;
} */

@media screen and (max-width: 992px){

  
}
/* button a{
  text-decoration: none;
}

.mpadding{
    padding: 0 0.5rem; 
    margin: 1rem;

  } */



`