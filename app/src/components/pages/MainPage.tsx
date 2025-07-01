import React, { useEffect, useRef, useState } from 'react';
import './MainPage.css';
import MapView from '../MapView';

const MainPage: React.FC = () => {

    let title, breadcrumb;
    title = 'MainPage';
    breadcrumb = 'bma map viewer';
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Function to toggle the sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <div className="flex flex-col items-center justify-between w-full p-4 border-b md:flex-row">
                {/* Left Side - Title and Breadcrumb */}
                <div className="flex flex-col items-start text-center md:text-left">
                    <h1 className="text-lg md:text-2xl font-semibold text-red-500">
                        {title}
                    </h1>
                    {/* Breadcrumb is hidden on mobile */}
                    <span className="text-xs md:text-sm text-[#683432] hidden md:inline">
                        {breadcrumb}
                    </span>
                </div>

                {/* Right Side - Account Information */}
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                    {/* Name and status are hidden on smaller screens */}
                    {/* <div className="flex-col items-end hidden md:flex">
            <span className="text-[#3A3A3A] font-medium">
              {user_data?.firstname} {user_data?.lastname}
            </span>
            <span className="bg-[#FF9D2A] text-white text-xs px-3 py-1 rounded-full mt-1">
              {user_data?.type}
            </span>
          </div> */}

                    <div className="relative">
                        <div className="flex items-center">
                            {/* Wrap the image in a relative container */}
                            <div className="relative">
                                {/* <img
                  src={user_data?.image}
                  alt="Account"
                  className="object-cover w-8 h-8 border border-gray-300 rounded-full md:h-10 md:w-10"
                /> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <MapView />
        </>
    );
};

export default MainPage;
