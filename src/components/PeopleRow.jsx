import React from "react";
import classNames from "classnames";

export default class PeopleRow extends React.Component {
  render() {
    const className = classNames("people-row", {});

    return (
      <div className={className}>
        <div className="person">
          <img src="/img/people/person2.jpg" alt="" />
        </div>
        <div className="person">
          <img src="/img/people/person3.jpg" alt="" />
        </div>
        <div className="person">
          <img src="/img/people/person1.jpg" alt="" />
        </div>
      </div>
    );
  }
}
