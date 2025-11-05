import React from "react";
import { Link } from "react-router-dom";
import {
    Navbar,
    MobileNav,
    Typography,
    Button,
    IconButton,
} from "@material-tailwind/react";
import {
    HomeIcon,
    InformationCircleIcon,
    FolderIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";

const MyNavbar = () => {
    const [openNav, setOpenNav] = React.useState(false);

    React.useEffect(() => {
        window.addEventListener("resize", () => {
            if (window.innerWidth >= 960) setOpenNav(false);
        });
    }, []);

    const navList = (
        <ul className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
            {[
                { to: "/", label: "Home", icon: <HomeIcon className="h-4 w-4 mr-1" /> },
                { to: "/about", label: "About", icon: <InformationCircleIcon className="h-4 w-4 mr-1" /> },
                { to: "/projects", label: "Projects", icon: <FolderIcon className="h-4 w-4 mr-1" /> },
                { to: "/contact", label: "Contact", icon: <EnvelopeIcon className="h-4 w-4 mr-1" /> },
            ].map(({ to, label, icon }) => (
                <Typography
                    as="li"
                    key={label}
                    variant="small"
                    color="blue-gray"
                    className="p-1 font-normal"
                >
                    <Link to={to} className="flex items-center hover:text-blue-700">
                        {icon}
                        {label}
                    </Link>
                </Typography>
            ))}
        </ul>
    );

    return (
        <div className="w-full">
            <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4">
                <div className="flex items-center justify-between text-blue-gray-900">

                    {/* Left: Logo as styled Button */}
                    <div className="flex-1">
                        <Button
  as={Link}
  to="/"
  variant="gradient"
  size="sm"
  className="text-white font-semibold text-sm hover:animate-flipXOnce-hover"
>
  Jacob's Portfolio
</Button>


                    </div>

                    {/* Center: Nav items */}
                    <div className="hidden lg:flex flex-1 justify-center">
                        {navList}
                    </div>

                    {/* Right: Sign In */}
                    <div className="flex-1 hidden lg:flex justify-end items-center gap-x-1">
                        <Button variant="gradient" size="sm">
                            <span>Sign in</span>
                        </Button>
                    </div>

                    {/* Mobile icon */}
                    <IconButton
                        variant="text"
                        className="ml-auto h-6 w-6 text-inherit lg:hidden"
                        ripple={false}
                        onClick={() => setOpenNav(!openNav)}
                    >
                        {openNav ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </IconButton>
                </div>

                {/* Mobile Nav */}
                <MobileNav open={openNav} className="px-4">
                    {navList}
                    <div className="flex items-center gap-x-1 mt-4">
                        <Button fullWidth variant="text" size="sm">Log In</Button>
                        <Button fullWidth variant="gradient" size="sm">Sign in</Button>
                    </div>
                </MobileNav>
            </Navbar>
        </div>
    );
};

export default MyNavbar;
