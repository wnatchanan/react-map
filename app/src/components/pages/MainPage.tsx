import React, { useEffect, useRef, useState } from 'react';
import './MainPage.css';
// import MapView from '../MapView';

const MainPage: React.FC = () => {

    let title, breadcrumb;
    title = 'MainPage';
    breadcrumb = 'BMA Map viewer';
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Function to toggle the sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <div className="flex flex-col items-center justify-between w-full p-4 border-b md:flex-row">
                <div className="flex flex-col items-start text-center md:text-left">
                    <h1 className="text-lg md:text-2xl font-semibold text-red-500">
                        {title}
                    </h1>
                    <span className="text-xs md:text-sm text-[#683432] hidden md:inline">
                        {breadcrumb}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                    {/* (right side of header – leave empty or add content if needed) */}
                </div>
            </div>

            {/* Body Content */}
            <div className="flex flex-col items-center justify-center w-full h-[90vh] bg-gray-100">
                <div className="flex items-center space-x-2 text-gray-800 text-xl font-medium">
                    <span>Custom Map</span>
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </>
    );


};

export default MainPage;
