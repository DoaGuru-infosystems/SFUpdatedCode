import { Link } from "react-router-dom";
import CLogo from "../assets/images/NewCLogo.png";
function Footer() {
  return (
    <>
      <footer className="bg-white rounded-lg shadow dark:bg-white-900 m-4 ">
        <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <Link
              to="https://doaguru.com/"
              target="_blank"
              className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse"
            >
              <img src={CLogo} className="h-8" alt="Flowbite Logo" />
              <span className="self-center text-2xl text-slate-400  font-semibold whitespace-nowrap ">
                DOAGuru InfoSystems
              </span>
            </Link>
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
              <li>
                <Link
                  to="https://doaguru.com/about_us"
                  target="_blank"
                  className="hover:underline me-4 md:me-6"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="https://doaguru.com/privacy-policy"
                  target="_blank"
                  className="hover:underline me-4 md:me-6"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="https://doaguru.com/terms-&-condition"
                  target="_blank"
                  className="hover:underline me-4 md:me-6"
                >
                  Terms & Condition
                </Link>
              </li>
              <li>
                <Link
                  to="https://doaguru.com/contact_us"
                  target="_blank"
                  className="hover:underline"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2024{" "}
            <Link
              to="https://doaguru.com/"
              className="hover:underline text-slate-400 "
              target="_blank"
            >
              DOAGuru Infosystems
            </Link>
            . All Rights Reserved.
          </span>
        </div>
      </footer>
    </>
  );
}
export default Footer;
