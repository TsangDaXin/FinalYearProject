import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { motion } from "framer-motion";

/**
 * Props for the AuthForm component.
 */
interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The source URL or base64 string for the company logo.
   */
  logoSrc: string;
  /**
   * Alt text for the company logo for accessibility.
   */
  logoAlt?: string;
  /**
   * The main title of the form.
   */
  title: string;
  /**
   * A short description or subtitle displayed below the title.
   */
  description?: string;
  /**
   * The primary call-to-action button (e.g., social login).
   */
  primaryActions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  /**
   * An array of secondary action buttons.
   */
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  /**
   * An optional action for skipping the login process.
   */
  skipAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom content to be displayed in the footer area.
   */
  footerContent?: React.ReactNode;
  /**
   * Custom children to render inside the form (e.g. input fields).
   */
  children?: React.ReactNode;
}

/**
 * A reusable authentication form component built with shadcn/ui.
 * It supports various providers, a customizable header, and animations.
 */
const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
  (
    {
      className,
      logoSrc,
      logoAlt = "Company Logo",
      title,
      description,
      primaryActions,
      secondaryActions,
      skipAction,
      footerContent,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col items-center justify-center relative w-full", className)}>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[384px] relative z-10"
        >
          <Card
            ref={ref}
            className={cn(
              "w-full overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
              "transition-all duration-300"
            )}
            {...props}
          >
          <CardHeader className="text-center">
            {/* Logo rendered from src */}
            <div className="mb-4 flex justify-center ">
              <img src={logoSrc} alt={logoAlt} className="h-20 w-20 object-contain rounded-[4px]" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-4">
            {children && <div className="mb-2">{children}</div>}
            {/* Primary Action Buttons */}
            <motion.div layout className="grid gap-2">
              {primaryActions.map((action, index) => (
                <Button 
                  key={index} 
                  onClick={action.onClick} 
                  className={cn(
                    "w-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                    action.label === "Create Account" || action.label === "Sign Up" 
                      ? "bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange/90 hover:to-amber-500/90 text-white border-0"
                      : "bg-gradient-to-r from-brand-blue to-indigo-500 hover:from-brand-blue/90 hover:to-indigo-500/90 text-white border-0"
                  )}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </motion.div>

            {/* "OR" separator */}
            {secondaryActions && secondaryActions.length > 0 && (
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
            )}

            {/* Secondary Action Buttons */}
            <motion.div layout className="grid gap-2">
              {secondaryActions?.map((action, index) => (
                <Button 
                  key={index} 
                  variant="secondary" 
                  className="w-full transition-all hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98] border border-white/5 bg-white/5" 
                  onClick={action.onClick}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </motion.div>
          </CardContent>

          {/* Skip Action Button */}
          {skipAction && (
            <CardFooter className="flex flex-col pb-6">
              <Button variant="outline" className="w-full transition-all hover:scale-[1.02] hover:bg-white/5 active:scale-[0.98]" onClick={skipAction.onClick}>
                {skipAction.label}
              </Button>
            </CardFooter>
          )}
        </Card>
        </motion.div>

        {/* Footer */}
        {footerContent && (
          <div className="mt-6 w-full max-w-[384px] px-8 text-center text-sm text-muted-foreground animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 [animation-delay:200ms]">
            {footerContent}
          </div>
        )}
      </div>
    );
  }
);
AuthForm.displayName = "AuthForm";

export { AuthForm };
