import './Layout.scss'
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar/Navbar';

/**
 * Layout container component that places the footer and navbar at the top and bottom of the page.
 * @component
 */
export const Layout = () => {
    return (
        <div className='layout'>
            <Navbar className='navbar' />
            <div className='main-content-container'>
                <Outlet />
            </div>
        </div>
    )
}