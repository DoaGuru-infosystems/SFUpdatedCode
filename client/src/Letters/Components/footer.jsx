import { Link } from "react-router-dom";
import CLogo from "../assets/images/CLogo.png";
import { Activity, ExternalLink } from "lucide-react";

function Footer() {
  const year = new Date().getFullYear();

  const footerLinks = [
    { name: "About", href: "https://doaguru.com/about_us" },
    { name: "Privacy Policy", href: "https://doaguru.com/privacy-policy" },
    { name: "Terms & Conditions", href: "https://doaguru.com/terms-&-condition" },
    { name: "Contact", href: "https://doaguru.com/contact_us" },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-[#13131f] border-t border-gray-200 dark:border-white/[0.06] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* Top Row: Logo + Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">

          {/* Brand */}
          <Link
            to="https://doaguru.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 no-underline group"
          >
            <img src={CLogo} alt="DOAGuru Infosystem" className="h-7 w-auto" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-primary transition-colors duration-200">
              DOAGuru Infosystem
            </span>
          </Link>

          {/* Nav Links */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 list-none p-0 m-0">
            {footerLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-gray-500 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light no-underline transition-colors duration-200"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-white/[0.06] mb-4" />

        {/* Bottom Row: Copyright + Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-400 dark:text-slate-500 text-center sm:text-left">
            © {year}{" "}
            <Link
              to="https://doaguru.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary-light hover:underline no-underline font-medium"
            >
              DOAGuru Infosystem
            </Link>
            . All Rights Reserved.
          </span>

          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <Activity size={12} className="text-accent-green" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
