import { FiGithub, FiYoutube, FiLifeBuoy } from "react-icons/fi";
import smLogo from "../assets/sl_logo.png";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <a
        className="footer_link"
        target="_blank"
        href="https://github.com/hashlips" rel="noreferrer"
      >
        <FiGithub />
      </a>
      <a
        className="footer_link"
        target="_blank"
        href="https://discord.com/invite/qh6MWhMJDN" rel="noreferrer"
      >
        <FiLifeBuoy />
      </a>
      <a
        className="footer_link"
        target="_blank"
        href="https://www.youtube.com/channel/UC1LV4_VQGBJHTJjEWUmy8nA" rel="noreferrer"
      >
        <FiYoutube />
      </a>
      <a className="footer_link" target="_blank" href="https://sketchylabs.io/" rel="noreferrer">
        <img width={20} height={20} src={smLogo} />
      </a>
    </footer>
  );
}

export default Footer;
