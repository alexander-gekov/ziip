const Footer = () => {
  return (
    <footer className="p-2 text-center text-sm text-gray-500 max-w-4xl mx-auto backdrop-blur-sm">
      with <span className="text-red-500">❤</span> by{" "}
      <a
        href="https://me.alexandergekov.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 hover:text-gray-900 transition-colors underline">
        Alexander Gekov
      </a>
      <span className="mx-2">·</span>
      <a
        href="https://github.com/alexandergekov/ziip.fun/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 hover:text-gray-900 transition-colors underline">
        MIT License
      </a>
    </footer>
  );
};

export default Footer;
