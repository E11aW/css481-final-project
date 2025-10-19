import './Layout.scss'
import { Outlet } from 'react-router-dom';

/**
 * Layout container component that places the footer and navbar at the top and bottom of the page.
 * @component
 */
export const Layout = () => {
    return (
        <div className='layout'>
            <div className='main-content-container'>
                <Outlet/>
            </div>
        </div>
    )
}