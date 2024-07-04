import { Player, Team } from "@/lib/models";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "../ui/button";
import { useQuestContext } from "../context/quest";
import { toast } from "../ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { CgDanger } from "react-icons/cg";
import { useRouter } from "next/navigation";

function ViewMemberDialog({
  open,
  data,
  boss,
  team,
}: {
  open: boolean;
  data: Player[];
  boss: boolean;
  team: Team;
}) {
  const initialRoles = data.reduce((acc: any, member: Player) => {
    acc[member.uid] = member.role;
    return acc;
  }, {});

  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>(
    initialRoles
  );
  const [alreadyAssigned, setAlreadyAssigned] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (Object.values(initialRoles).includes("unassigned"))
      setAlreadyAssigned(false);
  }, [initialRoles]);

  const roles = ["Shadow", "Nomad"];
  const q = useQuestContext();

  const handleSelection = (value: string, member: Player) => {
    setSelectedRoles({
      ...selectedRoles,
      [member.uid]: value,
    });
  };

  const getAvailableRoles = (memberId: string): string[] => {
    const usedRoles = Object.keys(selectedRoles)
      .filter((id: string) => id !== memberId)
      .map((id: string) => selectedRoles[id]);
    const availableRoles = roles.filter(
      (role) => !usedRoles.includes(role.toLowerCase())
    );
    return [...availableRoles, "unassigned"];
  };

  async function handleClick(): Promise<void> {
    const values = Object.values(selectedRoles);

    if (values.includes("unassigned")) {
      toast({ title: "Please assign every role", variant: "default" });
      return;
    }
    if (!q.quest || !q.user) return;

    fetch(`/api/${q.quest.id}/team/assignRoles`, {
      method: "POST",
      headers: {
        "X-Token": await q.user?.getIdToken(),
        "X-TID": team.id,
      },
      body: JSON.stringify(
        Object.entries(selectedRoles).map(([uid, role]) => ({ uid, role }))
      ),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 403) {
          toast({ title: "Server Error", variant: "destructive" });
          return;
        } else {
          toast({ title: "Roles Assigned", variant: "default" });
          setAlreadyAssigned(false);
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    open && (
      <div className="w-full h-[100%] fixed overflow-y-auto z-[50] bg-[#07020bba] backdrop-blur-md text-white">
        <div className="p-6 flex flex-col">
          <h1 className="text-5xl mt-10 font-semibold text-center title text-black stroke-white">
            {team.name}
          </h1>
          <p className="mt-5 text-lg">Team members</p>
          <div>
            {data.length == 0 && (
              <p className="text-center">
                Hey, gather up a team and come back here.
              </p>
            )}
            {data.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-[#686868a3] rounded-lg mt-2"
              >
                <div className="flex items-center">
                  <Image
                    src={member.dp}
                    alt="dp"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-2 mr-2">
                    <p className="">{member.name}</p>
                    <p
                      className={cn(
                        member.role == "unassigned" ? "" : "",
                        "text-sm text-primary-foreground capitalize"
                      )}
                    >
                      {selectedRoles[member.uid] || member.role}
                    </p>
                  </div>
                </div>
                {member.role != "boss" && (
                  <div>
                    {boss && data.length == q.quest?.TOTAL_ALLOWED_MEMBERS && (
                      <>
                        {!alreadyAssigned ? (
                          <Select
                            defaultValue={member.role}
                            onValueChange={(value) =>
                              handleSelection(value, member)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent defaultChecked>
                              <SelectGroup>
                                <SelectLabel>Roles</SelectLabel>
                                {getAvailableRoles(member.uid).map(
                                  (role: string, index: number) => (
                                    <SelectItem
                                      key={index}
                                      value={role.toLowerCase()}
                                    >
                                      {role}
                                    </SelectItem>
                                  )
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-center">
                            Already <br /> assigned
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!alreadyAssigned &&
            boss &&
            data.length == q.quest?.TOTAL_ALLOWED_MEMBERS && (
              <Alert variant="destructive" className="bg-[#fcfcfcc3] my-6">
                <CgDanger />
                <AlertDescription>
                  Assigning role can only be done once. Further changes are not
                  allowed.
                </AlertDescription>
              </Alert>
            )}
          {boss && data.length == q.quest?.TOTAL_ALLOWED_MEMBERS && (
            <Button
              disabled={alreadyAssigned}
              className={`${
                alreadyAssigned ? "cursor-not-allowed mt-4" : "cursor-pointer"
              }`}
              onClick={handleClick}
            >
              {alreadyAssigned ? "Already assigned ✅" : "Assign Roles"}
            </Button>
          )}
        </div>
      </div>
    )
  );
}

export default ViewMemberDialog;
