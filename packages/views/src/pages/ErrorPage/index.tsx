import React, { FC } from "react";
import { useRouteError } from "react-router-dom";

const Index: FC = () => {
  const error = useRouteError() as any;

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message || "123"}</i>
      </p>
    </div>
  );
};

export default Index;
