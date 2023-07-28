import Link from "next/link";
import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";

import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import localRoutes from "../../services/localRoutes";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { userInfo, logout } = useContext(AuthContext);
  const router = useRouter();
  const currentPage = localRoutes.find((item) => item.path === router.pathname);

  const user = {
    name: userInfo.name,
    email: userInfo.email,
    imageUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  };

  let navigation = [
    { name: "Home", href: "/", current: "/" === router.pathname },
    {
      name: "화물목록",
      href: "/orders/list",
      current: "/orders/list" === router.pathname,
    },
    {
      name: "화물등록",
      href: "/orders/create",
      current: "/orders/create" === router.pathname,
    },
  ];
  const navigationAdmin = [
    {
      name: "사용자관리",
      href: "/manage/user/list",
      current: "/manage/user/list" === router.pathname,
    },
  ];

  if (userInfo.auth_code === "ADMIN") {
    navigation = [...navigation, ...navigationAdmin];
  }

  const userNavigation = [
    { name: "Your Profile", href: "#" },
    {
      name: "Sign out",
      href: "#",
      onclick: logout,
    },
  ];

  return (
    <div className="fixed w-full z-50 border-b border-gray-200">
      <Disclosure as="nav" className="bg-white w-full">
        <div className="mx-auto px-5">
          <div className="flex h-16 items-center justify-between gap-10">
            <div className="flex items-center justify-between w-full">
              <div className="text-xl lg:pl-24">
                <span>{currentPage.name}</span>
              </div>
              {/* <div className="hidden lg:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "font-bold text-xl"
                          : "hover:text-xl transition-all",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div> */}
            </div>
            <div className="hidden lg:block min-w-fit">
              <div className="ml-4 flex items-center lg:ml-6">
                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex max-w-xs items-center rounded-full bg-mainColor1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainColor1">
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.imageUrl}
                        alt=""
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <a
                              href={item.href}
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                              onClick={() => item.onclick && item.onclick()}
                            >
                              {item.name}
                            </a>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
            <div className="-mr-2 flex lg:hidden">
              {/* Mobile menu button */}
              <Disclosure.Button
                className="inline-flex items-center justify-center rounded-md bg-white p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-300"
                onClick={() => setOpen((open) => !open)}
              >
                <span className="sr-only">Open main menu</span>
                {open ? (
                  <XMarkIcon
                    className="block h-6 w-6"
                    aria-hidden="true"
                    //onClick={() => setOpen(false)}
                  />
                ) : (
                  <Bars3Icon
                    className="block h-6 w-6"
                    aria-hidden="true"
                    //onClick={() => setOpen(true)}
                  />
                )}
              </Disclosure.Button>
            </div>
          </div>
        </div>

        {open && (
          <Disclosure.Panel className="lg:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 lg:px-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-normalGray text-white"
                      : "hover:bg-gray-200 text-gray-600",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  aria-current={item.current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-gray-700 pb-3 pt-4">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user.imageUrl}
                    alt=""
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-600">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400">
                    {user.email}
                  </div>
                </div>
                {/* <button
                type="button"
                className="ml-auto flex-shrink-0 rounded-full bg-mainColor1 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainColor1"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button> */}
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    onClick={() => {
                      if (item.onclick) item.onclick();
                      setOpen(false);
                    }}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-200"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        )}
      </Disclosure>
    </div>
  );
};

export default Navbar;
