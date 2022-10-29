import { render, screen } from "@testing-library/react";
import { getSession } from "next-auth/client";
import { mocked } from "ts-jest/utils";
import Post, { getServerSideProps } from "../../pages/posts/[slug]";
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

describe("Posts page", () => {
  it("remders correctly", () => {
    render(<Post post={post} />);
    expect(screen.getByText("My new post")).toBeInTheDocument();
    expect(screen.getByText("Post excerpt")).toBeInTheDocument();
  });

  it("redirects user if no subscription is found", async () => {
    const getSessionMocked = mocked(getSession);

    getSessionMocked.mockResolvedValueOnce(null);

    const response = await getServerSideProps({
      params: { slug: "my-new-post" },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: "/",
        }),
      })
    );
  });

  it("loads initial data", async () => {
    const getSessionMocked = mocked(getSession);
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

    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: "fake-active-subscription",
    } as any);

    const response = await getServerSideProps({
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
