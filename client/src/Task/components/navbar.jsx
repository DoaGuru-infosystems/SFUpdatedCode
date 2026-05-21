import CLogo from "../assets/images/NewCLogo.png";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const baseNavigation = [
  { name: "Dashboard", href: "/task/UserHome" },
  {
    name: "Assign Data",
    children: [
      { name: "View Task", href: "/task/TaskView" },
      { name: "Assigned Projects", href: "/task/AssignProjectDetails" },
      // Conditional items will be added based on department
    ]
  },
  {
    name: "Reports",
    children: [
      { name: "Task Report", href: "/task/EmployeeTaskReport" },
      { name: "Attendance Report", href: "/task/employee-attendance-report" },
      { name: "Leave Report", href: "/task/employee-leave-report" },
    ]
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar({ Logout, render }) {
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [userName, setUserName] = useState("User name");
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const employeeId = JSON.parse(localStorage.getItem("user"));
  const [navigation, setNavigation] = useState(baseNavigation);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(
          `https://sf.doaguru.com/api/getEmployee/${employeeId.id}`
        );
        setProfile(response.data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    console.log(profile, "profile", profile?.department);

    if (profile?.department) {
      const assignDataChildren = [
        { name: "View Task", href: "/task/TaskView" },
        { name: "Assigned Projects", href: "/task/AssignProjectDetails" },
      ];

      if (profile.department === "Development") {
        assignDataChildren.push({ name: "Assigned Development Task", href: "/task/check-assigned-development-task" });
      } else if (profile.department === "Digital Marketing") {
        assignDataChildren.push({ name: "Assigned Daily Target", href: "/task/AssignProjectTarget-Details" });
      }

      const updatedNavigation = [
        { name: "Dashboard", href: "/task/UserHome" },
        {
          name: "Assign Data",
          children: assignDataChildren
        },
        {
          name: "Reports",
          children: [
            { name: "Task Report", href: "/task/EmployeeTaskReport" },
            { name: "Attendance Report", href: "/task/employee-attendance-report" },
            { name: "Leave Report", href: "/task/employee-leave-report" },
          ]
        },
      ];

      setNavigation(updatedNavigation);
    }
  }, [profile]);

  useEffect(() => {
    setUser(localStorage.getItem("user"));
    let obj = localStorage.getItem("user");
    obj = JSON.parse(obj);
    setUserName(obj?.full_name || "User name");
  }, [render]);

  // Use optional chaining to avoid accessing properties on null
  const profileImageSrc = profile?.profileIMG
    ? profile.profileIMG.replace("http://sf.doaguru.com", "https://sf.doaguru.com")
    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt9ISaBFDC88ejiGrYACSt81CFq21QsZ6bow&s";

  return (
    <Disclosure as="nav" className="bg-white-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full sm:mx-5 px-2 sm:px-3 lg:px-1">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {!user || (
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                )}
              </div>
              <div className="flex flex-1 items-center ms-12 sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-12 w-auto"
                    src={CLogo}
                    alt="DOAGuru Infosystem"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  {!user || (
                    <div className="flex space-x-4">
                      {navigation.map((item) => {
                        if (item.children) {
                          return (
                            <Menu as="div" key={item.name} className="relative">
                              <div>
                                <Menu.Button className={classNames(
                                  "text-gray-300 hover:bg-gray-700 hover:text-white",
                                  "rounded-md px-3 py-2 text-sm font-medium flex items-center"
                                )}>
                                  {item.name}
                                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </Menu.Button>
                              </div>
                              <Transition
                                as="div"
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    {item.children.map((childItem) => {
                                      const isChildActive = location.pathname === childItem.href;
                                      return (
                                        <Menu.Item key={childItem.name}>
                                          {({ active }) => (
                                            <Link
                                              to={childItem.href}
                                              className={classNames(
                                                isChildActive ? 'bg-gray-100' : '',
                                                active ? 'bg-gray-100' : '',
                                                'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'
                                              )}
                                            >
                                              {childItem.name}
                                            </Link>
                                          )}
                                        </Menu.Item>
                                      );
                                    })}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          );
                        }

                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={classNames(
                              isActive
                                ? "bg-gray-900 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white",
                              "rounded-md px-3 py-2 text-sm font-medium"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {!user || (
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <div className="text-sm sm:text-lg mx-3 flex ">
                    <p>
                      <b>Hello {userName}</b>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src={profileImageSrc}
                          alt={`${profile?.full_name || "Employee"}'s profile`}
                        />
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ focus }) => (
                            <Link
                              to="/task/EmployeeDashboard"
                              className={classNames(
                                focus ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ focus }) => (
                            <button
                              onClick={() => Logout()}
                              className={classNames(
                                focus ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <Disclosure.Button className="w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                        {item.name}
                      </Disclosure.Button>
                      <div className="ml-4 space-y-1">
                        {item.children.map((childItem) => {
                          const isChildActive = location.pathname === childItem.href;
                          return (
                            <Disclosure.Button
                              key={childItem.name}
                              as={Link}
                              to={childItem.href}
                              className={classNames(
                                isChildActive
                                  ? "bg-gray-800 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                "block w-full rounded-md px-3 py-2 text-sm font-medium"
                              )}
                              aria-current={isChildActive ? "page" : undefined}
                            >
                              {childItem.name}
                            </Disclosure.Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isActive = location.pathname === item.href;
                return (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                );
              })}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
