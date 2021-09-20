import React from "react";
import PropTypes from "prop-types";

function CrossIcon(props) {
  const { className, color, onClick } = props;

  return (
    <i className={className} onClick={onClick}>
      <svg fill={color || "#000"} viewBox="0 0 34.42 34.42">
        <polygon points="34.42 6.67 27.76 0 17.21 10.54 6.67 0 0 6.67 10.54 17.21 0 27.76 6.67 34.42 17.21 23.88 27.76 34.42 34.42 27.76 23.88 17.21 34.42 6.67" />
      </svg>
    </i>
  );
}

CrossIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
};

export default CrossIcon;
