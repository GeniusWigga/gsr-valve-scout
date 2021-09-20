import classnames from "classnames";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner.jsx";

const Loader = (props) => {
  const [isLoading, setLoading] = useState(false);
  const { children, loaded, customClass } = props;

  useEffect(() => setLoading(true), []);

  if (!isLoading) {
    return null;
  }

  return (
    <Spinner
      className={classnames("valve-scout-spinner", { isLoading: !loaded, [customClass]: customClass })}
      loaded={loaded}
    >
      {children}
    </Spinner>
  );
};

export default Loader;
