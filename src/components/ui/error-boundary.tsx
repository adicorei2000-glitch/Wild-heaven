import { Component, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Props extends WithTranslation {
  children: ReactNode;
}

class Boundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { t } = this.props;
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("errors.crashTitle")}</h1>
        <p className="max-w-md text-muted-foreground">{t("errors.crashText")}</p>
        <Button onClick={() => window.location.reload()}>{t("errors.reload")}</Button>
      </div>
    );
  }
}

const ErrorBoundary = withTranslation()(Boundary);

export default ErrorBoundary;
