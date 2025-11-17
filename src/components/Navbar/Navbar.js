import './Navbar.scss';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MaxWidth } from '../MaxWidth/MaxWidth';
import Iceberg from '../../assets/Home/iceberg.png'

/** 
 * Navbar component that renders links to each subpage
 * @component
 */

export const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <header className='navbar'>
            <MaxWidth>
                <div className='navbar-row'>
                    <div className='logo'>
                        <NavLink to='/' aria-label='Go to Homepage'>
                            <img className='logo-image' src={Iceberg} alt='iceberg logo' />
                        </NavLink>
                    </div>
                    {/* Drop down icon for mobile */}
                    <button
                        className={`dropdown ${dropdownOpen ? 'open' : ''}`}
                        aria-label='Toggle Dropdown'
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    {/* Normal navbar links */}
                    <nav
                        className={`navbar-links ${dropdownOpen ? 'open' : ''}`}
                        aria-label='Primary Navigation'
                    >
                        <ul className='link-list'>
                            <li>
                                <NavLink
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                    to='/'
                                    aria-label='Go to Homepage'
                                >
                                    <span>Home</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                    to='/game'
                                    aria-label='Go to Game Page'
                                >
                                    <span>Game</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                    to='/data'
                                    aria-label='Go to Data Page'
                                >
                                    <span>Data</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                    to='/about-us'
                                    aria-label='Go to About Us Page'
                                >
                                    <span>About Us</span>
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </MaxWidth>
        </header>
    );
}