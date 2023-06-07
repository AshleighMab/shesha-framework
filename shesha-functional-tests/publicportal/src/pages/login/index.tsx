import { FacebookFilled, GoogleOutlined } from "@ant-design/icons";
import { ValidationErrors, useAuth, useTheme } from "@shesha/reactjs";
import { Checkbox, Form } from "antd";
import FormItem from "antd/lib/form/FormItem";
import { ShaButton, ShaTitle, ShaInput } from "components";
import { ILoginForm } from "models";
import Link from "next/link";
import { FC } from "react";
import { URL_FORGOT_PASSWORD } from "routes";
import { LoginPageWrapper } from "./styles";
import { LOGO } from "src/app-constants/application";

export const Login: FC = () => {
  const { theme } = useTheme();

  const {
    loginUser,
    errorInfo,
    isInProgress: { loginUser: isLoggingInUser },
  } = useAuth();

  const [form] = Form.useForm<ILoginForm>();

  const handleLogin = (payload: ILoginForm) => {
    loginUser(payload);
  };

  return (
    <LoginPageWrapper imgSrc={LOGO.src} imgWidth={350} colorTheme={theme}>
      <Form form={form} onFinish={handleLogin}>
        <ShaTitle title="Sign In" />

        <div className="sha-oauth-btn">
          <ShaButton className="sha-btn-google" icon={<GoogleOutlined />}>
            Sign in with Google
          </ShaButton>

          <ShaButton className="sha-btn-facebook" icon={<FacebookFilled />}>
            Sign in with Facebook
          </ShaButton>
        </div>

        <ShaInput
          name="userNameOrEmailAddress"
          label="Email Address"
          placeholder="Placeholder"
        />

        <ShaInput
          name="password"
          label="Password"
          placeholder="Placeholder"
          type="password"
        />

        <div className="sha-space-inline">
          <Checkbox className="sha-remember-me-check">Remember Me</Checkbox>

          <Link href={URL_FORGOT_PASSWORD}>
            <a className="sha-forget-password-link">Forgot Password</a>
          </Link>
        </div>

        <FormItem>
          <ShaButton
            type="primary"
            block
            loading={isLoggingInUser}
            size="large"
            htmlType="submit"
          >
            {isLoggingInUser ? "Signing in...." : "Sign In"}
          </ShaButton>
        </FormItem>

        <div className="sha-error">
          <ValidationErrors error={errorInfo} />
        </div>

        <div className="sha-space-inline lg-margin-top">
          <span className="sha-dont-have-password">Don't have an account?</span>

          <Link href={URL_FORGOT_PASSWORD}>
            <a className="sha-forget-password-link">Register</a>
          </Link>
        </div>
      </Form>
    </LoginPageWrapper>
  );
};

export default Login;
