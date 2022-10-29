import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/client";
import { useRouter } from "next/dist/client/router";
import { mocked } from "ts-jest/utils";
import Post, { getStaticProps } from "../../pages/posts/preview/[slug]";
import { getPrismicClient } from "../../services/prismic";

jest.mock("../../services/stripe.ts");

const post = {
  slug: "my-new-post",
  title: "My new post",
  content: "Post excerpt",
  updateAt: "10 de Abril",
};

jest.mock("../../services/prismic.ts");
jest.mock("next-auth/client");
jest.mock("next/dist/client/router");

describe("Post preview page", () => {
  it("remders correctly", () => {
    const useSessionMocked = mocked(useSession);

    useSessionMocked.mockReturnValueOnce([null, false]);

    render(<Post post={post} />);

    expect(screen.getByText("My new post")).toBeInTheDocument();
    expect(screen.getByText("Post excerpt")).toBeInTheDocument();
    expect(screen.getByText("Wanna continue reading?")).toBeInTheDocument();
  });

  it("redirects user to full post when user is subscribed", async () => {
    const useSessionMocked = mocked(useSession);
    const useRouterMocked = mocked(useRouter);
    const pushMocked = jest.fn();

    useSessionMocked.mockReturnValueOnce([
      { activeSubscription: "fake-active-subscription" },
      false,
    ] as any);

    useRouterMocked.mockReturnValueOnce({
      push: pushMocked,
    } as any);

    render(<Post post={post} />);

    expect(pushMocked).toHaveBeenCalledWith("/posts/my-new-post");
  });

  it("loads initial data", async () => {
    const getPrismicClientMocked = mocked(getPrismicClient);

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [{ type: "heading", text: "My new post" }],
          content: [
            {
              type: "paragraph",
              text: "Post excerpt",
            },
          ],
        },
        last_publication_date: "04-01-2021",
      }),
    } as any);

    const response = await getStaticProps({
      params: { slug: "my-new-post" },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          post: {
            slug: "my-new-post",
            title: "My new post",
            content: "<p>Post excerpt</p>",
            updateAt: "01 de abril de 2021",
          },
        }),
      })
    );
  });
});
