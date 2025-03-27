import { useEffect } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import LogoWhite from '../../../assets/images/whitelogo.png';
import LogoProfile from '../../../assets/images/profile.png';

const navigation = (userId) => [
  { name: 'Dashboard', href: `/teacher/${userId}`, current: false },
  { name: 'Units', href: `/teacher/${userId}/units`, current: false },
  { name: 'Lectures', href: `/teacher/${userId}/lectures`, current: false },
  { name: 'Transcript', href: `/teacher/${userId}/transcript`, current: false },
  { name: 'Room', href: `/teacher/${userId}/room`, current: false },
  { name: 'Attendance', href: `/teacher/${userId}/attendance`, current: false },
  { name: 'Resources', href: `/teacher/${userId}/resources`, current: false },
  { name: 'Course Planner', href: `/teacher/${userId}/generatecp`, current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TeacherNavBar({ userId }) {
  useEffect(() => {
    console.log(userId);  // Log userId on component load
  });

  return (
    <Disclosure as="nav" className="bg-gray-800 w-full">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
        <div className="relative flex h-16 items-center justify-between w-full">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-gray-800">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              <XMarkIcon className="hidden h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-between sm:items-stretch sm:justify-start w-full">
            <div className="flex flex-shrink-0 items-center">
              <img
                alt="Your Company"
                src={LogoWhite}
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation(userId).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <div>
                <MenuButton className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="sr-only">Open user menu</span>
                  <img
                    alt=""
                    src={LogoProfile}
                    className="h-8 w-8 rounded-full"
                  />
                </MenuButton>
              </div>
              <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem>
                  <Link to={`/student/${userId}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</Link>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation(userId).map((item) => (
            <DisclosureButton
              key={item.name}
              as={Link}
              to={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium'
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
